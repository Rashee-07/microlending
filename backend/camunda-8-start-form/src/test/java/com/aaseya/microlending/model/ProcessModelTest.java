package com.aaseya.microlending.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.InputStream;
import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import javax.xml.parsers.DocumentBuilderFactory;

import org.junit.jupiter.api.Test;
import org.w3c.dom.Element;

import com.aaseya.microlending.constants.ProcessConstants;
import com.aaseya.microlending.worker.CreditAssessmentWorker;
import com.aaseya.microlending.worker.OnboardingWorker;
import com.aaseya.microlending.worker.ProcessFlowWorker;
import com.aaseya.microlending.worker.UserTaskWorker;

import io.camunda.zeebe.model.bpmn.Bpmn;
import io.camunda.zeebe.model.bpmn.BpmnModelInstance;
import io.camunda.zeebe.model.bpmn.instance.Process;
import io.camunda.zeebe.model.bpmn.instance.zeebe.ZeebeCalledDecision;
import io.camunda.zeebe.model.bpmn.instance.zeebe.ZeebeTaskDefinition;
import io.camunda.zeebe.spring.client.annotation.JobWorker;

/**
 * Checks that the BPMN/DMN models and the Java code agree, so a renamed job type or decision id
 * fails the build instead of leaving process instances stuck in Zeebe.
 */
class ProcessModelTest {

  private static final Class<?>[] WORKERS = {
      CreditAssessmentWorker.class, OnboardingWorker.class, ProcessFlowWorker.class, UserTaskWorker.class };

  private static BpmnModelInstance loanProcess() {
    InputStream bpmn = ProcessModelTest.class.getResourceAsStream("/model/microlending-loan.bpmn");
    assertThat(bpmn).as("model/microlending-loan.bpmn on the classpath").isNotNull();
    BpmnModelInstance model = Bpmn.readModelFromStream(bpmn);
    Bpmn.validateModel(model);
    return model;
  }

  @Test
  void processIdMatchesConstant() {
    Set<String> ids = loanProcess().getModelElementsByType(Process.class).stream()
        .map(Process::getId).collect(Collectors.toSet());
    assertThat(ids).contains(ProcessConstants.PROCESS_ID);
  }

  @Test
  void everyServiceTaskHasAJobWorker() {
    Set<String> bpmnTypes = loanProcess().getModelElementsByType(ZeebeTaskDefinition.class).stream()
        .map(ZeebeTaskDefinition::getType).collect(Collectors.toSet());

    Set<String> workerTypes = Arrays.stream(WORKERS)
        .flatMap(c -> Arrays.stream(c.getDeclaredMethods()))
        .map((Method m) -> m.getAnnotation(JobWorker.class))
        .filter(a -> a != null)
        .map(JobWorker::type)
        .collect(Collectors.toSet());

    assertThat(bpmnTypes).isNotEmpty();
    assertThat(workerTypes).as("@JobWorker types in the worker package").containsAll(bpmnTypes);
  }

  @Test
  void creditDecisionIsDefinedInTheDmn() throws Exception {
    Set<String> calledDecisions = loanProcess().getModelElementsByType(ZeebeCalledDecision.class).stream()
        .map(ZeebeCalledDecision::getDecisionId).collect(Collectors.toSet());
    assertThat(calledDecisions).isNotEmpty();

    try (InputStream dmn = getClass().getResourceAsStream("/model/credit-decision.dmn")) {
      assertThat(dmn).as("model/credit-decision.dmn on the classpath").isNotNull();
      DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
      factory.setNamespaceAware(true);
      var decisions = factory.newDocumentBuilder().parse(dmn).getElementsByTagNameNS("*", "decision");
      Set<String> dmnIds = new java.util.HashSet<>();
      for (int i = 0; i < decisions.getLength(); i++) {
        dmnIds.add(((Element) decisions.item(i)).getAttribute("id"));
      }
      assertThat(dmnIds).containsAll(calledDecisions);
    }
  }
}
